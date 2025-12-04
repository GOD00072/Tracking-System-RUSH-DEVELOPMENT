import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
}

const SEO = ({ 
  title, 
  description, 
  image = '/seo-cover.png', 
  type = 'website' 
}: SEOProps) => {
  const siteTitle = 'PakkuNeko';
  const defaultDescription = 'บริการฝากซื้อและนำเข้าสินค้าจากญี่ปุ่นสู่ไทย ครบวงจร ทางรถ ทางเรือ ทางอากาศ ดูแลโดยทีมงานมืออาชีพในญี่ปุ่น';
  
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - ฝากซื้อและฝากส่งสินค้าจากญี่ปุ่นสู่ไทย`;
  const metaDescription = description || defaultDescription;
  
  // Ensure image is absolute URL if possible, or use relative
  // Note: normally we would prepend window.location.origin but for SSR/consistency we'll keep it simple
  const metaImage = image;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="theme-color" content="#FFFBF2" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
