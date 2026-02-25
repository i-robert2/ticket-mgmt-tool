import React from 'react';

export default function NotificationsPanel({ notifications, onClear, onDismiss }) {
  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>
          Notifications
          {notifications.length > 0 && (
            <span className="notif-count">{notifications.length}</span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button className="btn-clear" onClick={onClear}>Clear All</button>
        )}
      </div>
      <div className="notifications-body">
        {notifications.length === 0 ? (
          <p className="empty-msg">No notifications.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
              <div className="notif-message">{n.message}</div>
              <div className="notif-meta">
                <span className="notif-region">{n.region}</span>
                <span className="notif-time">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              <button className="btn-dismiss" onClick={() => onDismiss(n.id)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
