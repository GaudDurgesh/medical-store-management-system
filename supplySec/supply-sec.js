// Supplier Management JavaScript
const API_BASE = 'http://localhost:5000/api';

let suppliers = [];
let editingSupplierId = null;

// DOM Elements
const supplierTable = document.getElementById('supplierTable').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('searchInput');
const addSupplierBtn = document.getElementById('addSupplierBtn');
const supplierModal = document.getElementById('supplierModal');
const supplierForm = document.getElementById('supplierForm');
const closeBtn = document.querySelector('.closeBtn');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addSupplierBtn.addEventListener('click', () => openSupplierModal());
    closeBtn.addEventListener('click', () => closeSupplierModal());
    supplierForm.addEventListener('submit', handleSupplierSubmit);
    searchInput.addEventListener('input', handleSearch);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === supplierModal) {
            closeSupplierModal();
        }
    });
}

// Load all suppliers from API
async function loadSuppliers() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/suppliers`);
        const result = await response.json();
        
        if (result.success) {
            suppliers = result.data;
            displaySuppliers(suppliers);
        } else {
            showError('Failed to load suppliers: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showError('Failed to connect to server. Please check if the backend is running.');
    } finally {
        showLoading(false);
    }
}

// Display suppliers in table
function displaySuppliers(supplierList) {
    supplierTable.innerHTML = '';
    
    if (supplierList.length === 0) {
        supplierTable.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #9aa7b2;">No suppliers found</td></tr>';
        return;
    }
    
    supplierList.forEach(supplier => {
        const row = supplierTable.insertRow();
        
        // Apply row styling based on status
        if (supplier.status === 'inactive') {
            row.classList.add('inactive-row');
        }
        
        row.innerHTML = `
            <td>
                <div class="supplier-name">
                    ${supplier.name}
                    ${supplier.status === 'inactive' ? '<span class="inactive-badge">Inactive</span>' : ''}
                </div>
            </td>
            <td class="contact-person">${supplier.contact_person}</td>
            <td class="phone">
                <a href="tel:${supplier.phone}" class="phone-link">${supplier.phone}</a>
            </td>
            <td class="email">
                ${supplier.email ? `<a href="mailto:${supplier.email}" class="email-link">${supplier.email}</a>` : '<span class="no-data">-</span>'}
            </td>
            <td class="address">${supplier.address || '<span class="no-data">-</span>'}</td>
            <td class="status">
                <span class="status-badge ${supplier.status === 'active' ? 'active' : 'inactive'}">
                    ${supplier.status}
                </span>
            </td>
            <td class="actions">
                <button class="btn-edit" onclick="editSupplier(${supplier.id})" title="Edit">
                    <span class="icon">✏️</span>
                </button>
                ${supplier.status === 'active' ? 
                    `<button class="btn-deactivate" onclick="deactivateSupplier(${supplier.id})" title="Deactivate">
                        <span class="icon">🚫</span>
                    </button>` : 
                    `<button class="btn-activate" onclick="activateSupplier(${supplier.id})" title="Activate">
                        <span class="icon">✅</span>
                    </button>`
                }
                <button class="btn-delete" onclick="deleteSupplier(${supplier.id})" title="Permanently Delete">
                    <span class="icon">🗑️</span>
                </button>
            </td>
        `;
    });
}

// Open supplier modal for add/edit
function openSupplierModal(supplier = null) {
    editingSupplierId = supplier ? supplier.id : null;
    modalTitle.textContent = supplier ? 'Edit Supplier' : 'Add Supplier';
    saveBtn.textContent = supplier ? 'Update' : 'Save';
    
    if (supplier) {
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('contactPerson').value = supplier.contact_person;
        document.getElementById('phone').value = supplier.phone;
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('address').value = supplier.address || '';
        document.getElementById('status').value = supplier.status || 'active';
    } else {
        supplierForm.reset();
        document.getElementById('status').value = 'active';
    }
    
    supplierModal.style.display = 'block';
}

// Close supplier modal
function closeSupplierModal() {
    supplierModal.style.display = 'none';
    editingSupplierId = null;
    supplierForm.reset();
}

// Handle supplier form submission
async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('supplierName').value.trim(),
        contact_person: document.getElementById('contactPerson').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        status: document.getElementById('status').value
    };
    
    // Validation
    if (!formData.name || !formData.contact_person || !formData.phone) {
        showError('Please fill in all required fields (Name, Contact Person, Phone)');
        return;
    }
    
    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        showError('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    try {
        showLoading(true);
        
        const url = editingSupplierId 
            ? `${API_BASE}/suppliers/${editingSupplierId}` 
            : `${API_BASE}/suppliers`;
        
        const method = editingSupplierId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            closeSupplierModal();
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error saving supplier:', error);
        showError('Failed to save supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Edit supplier
function editSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (supplier) {
        openSupplierModal(supplier);
    }
}

// Deactivate supplier (soft delete)
async function deactivateSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    const confirmDeactivate = confirm(`Are you sure you want to deactivate "${supplier.name}"? This will mark the supplier as inactive but keep all records.`);
    if (!confirmDeactivate) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}/deactivate`, {
            method: 'PUT'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error deactivating supplier:', error);
        showError('Failed to deactivate supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Permanently delete supplier
async function deleteSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    const confirmDelete = confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY delete "${supplier.name}"?\n\nThis action cannot be undone and will:\n- Remove all supplier records\n- Fail if any medicines are linked to this supplier\n\nType "DELETE" to confirm:`);
    
    if (!confirmDelete) return;
    
    // Additional confirmation for permanent deletion
    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
        showError('Deletion cancelled. You must type "DELETE" to confirm.');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message);
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error deleting supplier:', error);
        showError('Failed to delete supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Activate supplier
async function activateSupplier(id) {
    const supplier = suppliers.find(sup => sup.id === id);
    if (!supplier) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/suppliers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...supplier,
                status: 'active'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Supplier activated successfully');
            loadSuppliers(); // Reload the table
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error activating supplier:', error);
        showError('Failed to activate supplier. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        displaySuppliers(suppliers);
        return;
    }
    
    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contact_person.toLowerCase().includes(searchTerm) ||
        supplier.phone.includes(searchTerm) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
        (supplier.address && supplier.address.toLowerCase().includes(searchTerm))
    );
    
    displaySuppliers(filteredSuppliers);
}

// Utility functions
function showLoading(show) {
    if (show) {
        document.body.style.cursor = 'wait';
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
        document.body.appendChild(loadingIndicator);
    } else {
        document.body.style.cursor = 'default';
        // Remove loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <span class="notification-icon">❌</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <span class="notification-icon">✅</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Add CSS for enhanced styling and notifications
const style = document.createElement('style');
style.textContent = `
    /* Enhanced notification styles */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        color: white;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 320px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .notification.success {
        background: linear-gradient(135deg, #10b981, #059669);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .notification-icon {
        font-size: 18px;
        flex-shrink: 0;
    }
    
    .notification-message {
        flex: 1;
        font-weight: 500;
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    
    /* Enhanced table row styles */
    .inactive-row {
        background-color: rgba(156, 163, 175, 0.1) !important;
        opacity: 0.7;
    }
    
    .inactive-row:hover {
        background-color: rgba(156, 163, 175, 0.2) !important;
    }
    
    /* Enhanced supplier name styling */
    .supplier-name {
        font-weight: 600;
        color: #60a5fa;
        font-size: 15px;
    }
    
    .inactive-badge {
        display: inline-block;
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7em;
        font-weight: 500;
        margin-left: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Enhanced contact styling */
    .contact-person {
        color: #e2e8f0;
        font-weight: 500;
    }
    
    .phone-link, .email-link {
        color: #60a5fa;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .phone-link:hover, .email-link:hover {
        color: #3b82f6;
        text-decoration: underline;
    }
    
    .no-data {
        color: #6b7280;
        font-style: italic;
    }
    
    /* Enhanced address styling */
    .address {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #cbd5e1;
    }
    
    /* Status badge styling */
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-badge.active {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }
    
    .status-badge.inactive {
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
    }
    
    /* Enhanced action buttons */
    .actions {
        white-space: nowrap;
    }
    
    .btn-edit, .btn-delete, .btn-activate, .btn-deactivate {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 8px;
        margin: 0 2px;
        border-radius: 8px;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn-edit:hover {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        transform: translateY(-1px);
    }
    
    .btn-activate:hover {
        background: linear-gradient(135deg, #10b981, #059669);
        transform: translateY(-1px);
    }
    
    .btn-deactivate:hover {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        transform: translateY(-1px);
    }
    
    .btn-delete:hover {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        transform: translateY(-1px);
    }
    
    .btn-edit .icon, .btn-delete .icon, .btn-activate .icon, .btn-deactivate .icon {
        filter: grayscale(1);
        transition: filter 0.2s;
    }
    
    .btn-edit:hover .icon, .btn-delete:hover .icon, .btn-activate:hover .icon, .btn-deactivate:hover .icon {
        filter: grayscale(0);
    }
    
    /* Loading indicator */
    #loading-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        padding: 20px 30px;
        border-radius: 15px;
        border: 1px solid rgba(96, 165, 250, 0.3);
        color: #e2e8f0;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 9999;
        font-weight: 500;
    }
    
    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(96, 165, 250, 0.3);
        border-top: 2px solid #60a5fa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Enhanced modal textarea */
    form textarea {
        width: 100%;
        padding: 14px 16px;
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        color: #f1f5f9;
        font-size: 15px;
        margin-top: 5px;
        box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
    }
    
    form textarea:focus {
        outline: none;
        border-color: #60a5fa;
        box-shadow: 0 0 15px rgba(96, 165, 250, 0.6), inset 0 4px 10px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(style);