const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changes: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true }
  },
  { collection: 'audit_logs' }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);