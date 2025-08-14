// ================================================================================================
// DATABASE CONNECTION STUB (.js) - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// JavaScript stub file untuk compatibility dengan legacy imports
// ================================================================================================

// Stub connection untuk monitoring compatibility
const connection = {
  query: async (sql, params) => {
    console.log('Connection stub - query:', sql);
    return { rows: [], rowCount: 0 };
  },
  close: async () => {
    console.log('Connection stub - close');
    return true;
  },
  isConnected: () => {
    return false; // Stub implementation
  }
};

export default connection;