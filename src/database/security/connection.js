// ================================================================================================
// SECURITY CONNECTION STUB (.js) - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// JavaScript stub file untuk security connection compatibility dengan legacy imports
// ================================================================================================

// Stub connection untuk security compatibility
const connection = {
  query: async (sql, params) => {
    console.log('Security Connection stub - query:', sql);
    return { rows: [], rowCount: 0 };
  },
  close: async () => {
    console.log('Security Connection stub - close');
    return true;
  },
  isConnected: () => {
    return false; // Stub implementation
  },
  setRoleContext: async (role) => {
    console.log('Security Connection stub - setRoleContext:', role);
    return true;
  },
  validatePermissions: async (resource, action) => {
    console.log('Security Connection stub - validatePermissions:', { resource, action });
    return true; // Stub implementation - allow all for now
  }
};

export default connection;