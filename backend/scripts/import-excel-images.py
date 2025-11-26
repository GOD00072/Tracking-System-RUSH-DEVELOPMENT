#!/usr/bin/env python3
"""
Extract images from MIRIN Excel and import to database
Maps images to order items based on Excel row position
"""

import os
import sys
import json
import shutil
import zipfile
import re
from xml.etree import ElementTree as ET
import psycopg2
from psycopg2.extras import Json

# Configuration
EXCEL_FILE = "/home/binamon/Pictures/งาน/MIRIN เครื่องบิน 2025.xlsx"
UPLOADS_DIR = "/home/binamon/Documents/Tracking System (RUSH DEVELOPMENT)/backend/uploads/products"
TEMP_DIR = "/tmp/excel_images_extract"
BASE_URL = "http://localhost:5000"

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://trackinguser:trackingpass123@localhost:5434/tracking_system')

def extract_images_and_mappings(excel_path, output_dir):
    """Extract images and their row mappings from Excel"""
    os.makedirs(output_dir, exist_ok=True)

    namespaces = {
        'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    row_to_images = {}  # row_number -> list of image paths

    with zipfile.ZipFile(excel_path, 'r') as z:
        # Find all drawing files with relationships
        drawing_files = []
        for name in z.namelist():
            if name.startswith('xl/drawings/drawing') and name.endswith('.xml') and 'vml' not in name:
                rels_path = name.replace('xl/drawings/', 'xl/drawings/_rels/').replace('.xml', '.xml.rels')
                if rels_path in z.namelist():
                    drawing_files.append((name, rels_path))

        print(f"Found {len(drawing_files)} drawing files with relationships")

        for drawing_path, rels_path in drawing_files:
            print(f"\nProcessing {drawing_path}...")

            # Read relationships
            rels_xml = z.read(rels_path).decode('utf-8')
            rels_root = ET.fromstring(rels_xml)

            rel_map = {}  # rId -> image filename
            for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                rid = rel.get('Id')
                target = rel.get('Target')
                if target and 'media' in target:
                    rel_map[rid] = target.split('/')[-1]

            print(f"  Found {len(rel_map)} image relationships")

            # Read drawing XML
            drawing_xml = z.read(drawing_path).decode('utf-8')
            root = ET.fromstring(drawing_xml)

            # Parse both oneCellAnchor and twoCellAnchor
            anchors = root.findall('.//xdr:oneCellAnchor', namespaces) + root.findall('.//xdr:twoCellAnchor', namespaces)

            for anchor in anchors:
                from_elem = anchor.find('xdr:from', namespaces)
                if from_elem is None:
                    from_elem = anchor.find('.//xdr:from', namespaces)

                if from_elem is not None:
                    row_elem = from_elem.find('xdr:row', namespaces)
                    if row_elem is not None:
                        # Excel rows in XML are 0-indexed
                        # Row 2 in XML = Excel row 3 = sequence_number 2 (data starts at row 2)
                        excel_row = int(row_elem.text) + 1

                        # Get image reference
                        blip = anchor.find('.//a:blip', namespaces)
                        if blip is not None:
                            embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                            if embed and embed in rel_map:
                                img_filename = rel_map[embed]

                                if excel_row not in row_to_images:
                                    row_to_images[excel_row] = []
                                row_to_images[excel_row].append(img_filename)

        # Extract all media files
        print(f"\nExtracting media files...")
        extracted_files = {}
        skipped_files = 0
        for file_info in z.namelist():
            if file_info.startswith('xl/media/'):
                filename = os.path.basename(file_info)
                if filename:
                    try:
                        source = z.read(file_info)
                        temp_path = os.path.join(output_dir, filename)
                        with open(temp_path, 'wb') as f:
                            f.write(source)
                        extracted_files[filename] = temp_path
                    except Exception as e:
                        print(f"  Warning: Skipped corrupted file {filename}: {e}")
                        skipped_files += 1

        print(f"  Extracted {len(extracted_files)} media files")
        if skipped_files > 0:
            print(f"  Skipped {skipped_files} corrupted files")

    return row_to_images, extracted_files

def copy_images_to_uploads(row_to_images, extracted_files, uploads_dir):
    """Copy images to uploads directory and return row -> URL mapping"""
    os.makedirs(uploads_dir, exist_ok=True)

    row_to_urls = {}

    for excel_row, img_list in row_to_images.items():
        urls = []
        for img_filename in img_list:
            if img_filename in extracted_files:
                # Create new filename with row number
                ext = os.path.splitext(img_filename)[1]
                new_filename = f"mirin-row{excel_row}-{img_filename}"
                new_path = os.path.join(uploads_dir, new_filename)

                # Copy file
                shutil.copy2(extracted_files[img_filename], new_path)

                # Create URL
                url = f"{BASE_URL}/uploads/products/{new_filename}"
                urls.append(url)

        if urls:
            row_to_urls[excel_row] = urls

    return row_to_urls

def update_database(row_to_urls):
    """Update order items with image URLs based on sequence number"""

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Get all order items
        cur.execute("""
            SELECT id, sequence_number, customer_name, product_images
            FROM order_items
            WHERE sequence_number IS NOT NULL
            ORDER BY sequence_number
        """)

        items = cur.fetchall()
        print(f"\nFound {len(items)} order items with sequence numbers")

        updated_count = 0
        skipped_count = 0

        for item_id, seq_num, customer_name, existing_images in items:
            # Map sequence_number to Excel row
            # sequence_number 1 = Excel row 2 (header is row 1)
            excel_row = seq_num + 1

            if excel_row in row_to_urls:
                new_images = row_to_urls[excel_row]

                # Merge with existing images
                current_images = existing_images if existing_images else []
                if isinstance(current_images, str):
                    try:
                        current_images = json.loads(current_images)
                    except:
                        current_images = []

                # Add new images (avoid duplicates)
                added = False
                for img_url in new_images:
                    if img_url not in current_images:
                        current_images.append(img_url)
                        added = True

                if added:
                    cur.execute("""
                        UPDATE order_items
                        SET product_images = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (Json(current_images), item_id))

                    updated_count += 1

                    if updated_count <= 10:
                        print(f"  Updated seq #{seq_num} ({customer_name[:20] if customer_name else 'N/A'}): {len(new_images)} images")
                    elif updated_count == 11:
                        print(f"  ... continuing ...")
            else:
                skipped_count += 1

        conn.commit()

        print(f"\n{'='*50}")
        print(f"Updated: {updated_count} items")
        print(f"Skipped (no image): {skipped_count} items")
        print(f"{'='*50}")

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

def main():
    print("=" * 60)
    print("MIRIN Excel Image Import Script")
    print("=" * 60)

    # Check files
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: Excel file not found: {EXCEL_FILE}")
        sys.exit(1)

    # Step 1: Extract images and mappings
    print(f"\n1. Extracting images from Excel...")
    print(f"   Source: {EXCEL_FILE}")

    row_to_images, extracted_files = extract_images_and_mappings(EXCEL_FILE, TEMP_DIR)

    print(f"\n   Found images for {len(row_to_images)} Excel rows")

    # Show sample mappings
    print("\n   Sample row -> image mappings:")
    for row in sorted(row_to_images.keys())[:5]:
        print(f"     Excel Row {row}: {row_to_images[row]}")

    # Step 2: Copy to uploads
    print(f"\n2. Copying images to uploads folder...")
    print(f"   Destination: {UPLOADS_DIR}")

    row_to_urls = copy_images_to_uploads(row_to_images, extracted_files, UPLOADS_DIR)
    print(f"   Copied images for {len(row_to_urls)} rows")

    # Step 3: Update database
    print(f"\n3. Updating order items in database...")
    update_database(row_to_urls)

    # Cleanup
    print(f"\n4. Cleaning up temp files...")
    shutil.rmtree(TEMP_DIR, ignore_errors=True)

    print("\n" + "=" * 60)
    print("Import completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
