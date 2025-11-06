import { useState } from 'react';
import { Plus, Edit, Trash2, Users, MessageCircle, Search } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import LineSearchModal from '../../components/LineSearchModal';

const AdminCustomersPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showLineSearchModal, setShowLineSearchModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    lineId: '',
    address: '',
    notes: '',
    userId: '',
    airtableId: '',
  });

  const { data: customersData, isLoading } = useCustomers(1, 50);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      companyName: formData.companyName || undefined,
      contactPerson: formData.contactPerson || undefined,
      phone: formData.phone || undefined,
      lineId: formData.lineId || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      userId: formData.userId || undefined,
      airtableId: formData.airtableId || undefined,
    };

    if (editingCustomer) {
      updateCustomer.mutate(
        {
          id: editingCustomer.id,
          data: customerData,
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingCustomer(null);
            resetForm();
          },
        }
      );
    } else {
      createCustomer.mutate(customerData, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      lineId: '',
      address: '',
      notes: '',
      userId: '',
      airtableId: '',
    });
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      lineId: customer.lineId || '',
      address: customer.address || '',
      notes: customer.notes || '',
      userId: customer.userId || '',
      airtableId: customer.airtableId || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer.mutate(id);
    }
  };

  const handleSelectLineUser = (lineUser: any) => {
    setFormData({
      ...formData,
      lineId: lineUser.lineId,
      userId: lineUser.id,
      companyName: formData.companyName || lineUser.fullName || '',
      contactPerson: formData.contactPerson || lineUser.fullName || '',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-600 text-sm">จัดการข้อมูลลูกค้า พร้อมซิงก์กับ LINE OA</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company / Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LINE ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customersData?.data.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        {customer.companyName && (
                          <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                        )}
                        {customer.contactPerson && (
                          <div className="text-sm text-gray-600">{customer.contactPerson}</div>
                        )}
                        {!customer.companyName && !customer.contactPerson && (
                          <div className="text-sm text-gray-400">No name</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.lineId ? (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">{customer.lineId}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{customer.address || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{customer.orders?.length || 0} orders</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customersData && customersData.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No customers found. Create your first customer!</div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="บริษัท ABC จำกัด"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="คุณสมชาย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="081-234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    LINE ID (สำหรับ LINE OA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.lineId}
                      onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="U1234567890abcdef"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLineSearchModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                      title="Search LINE Users"
                    >
                      <Search className="w-4 h-4" />
                      ค้นหา
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">LINE User ID สำหรับซิงก์กับ LINE Official Account</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Advanced (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">User ID (UUID)</label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="550e8400-e29b-41d4-a716-..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Airtable ID</label>
                    <input
                      type="text"
                      value={formData.airtableId}
                      onChange={(e) => setFormData({ ...formData, airtableId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="recXXXXXXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createCustomer.isPending || updateCustomer.isPending
                    ? 'Saving...'
                    : editingCustomer
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE User Search Modal */}
      <LineSearchModal
        isOpen={showLineSearchModal}
        onClose={() => setShowLineSearchModal(false)}
        onSelectUser={handleSelectLineUser}
      />
    </div>
  );
};

export default AdminCustomersPage;
