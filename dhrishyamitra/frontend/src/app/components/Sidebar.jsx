import { Link, useLocation } from "react-router-dom";
import { Images, Users, Upload, MessageSquare, Sparkles, ScanFace } from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Gallery", icon: Images },
    { path: "/people", label: "People", icon: Users },
    { path: "/label-faces", label: "Label Faces", icon: ScanFace },
    { path: "/upload", label: "Upload", icon: Upload },
    { path: "/chat", label: "AI Assistant", icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-30">

      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Drishyamitra
            </h1>
            <p className="text-xs text-gray-500">AI Photo Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            // Better active detection
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "text-purple-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-purple-50 rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="font-medium relative z-10">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                AI Features
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Face recognition, smart search, and auto-organization
              </p>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}