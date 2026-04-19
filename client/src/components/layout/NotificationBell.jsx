import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import api from "../../services/api";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");

        if (!isCancelled) {
          setNotifications(response.data);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
