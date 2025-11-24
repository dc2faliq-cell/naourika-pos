import React, { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  UserCircle,
  ChevronFirst,
  ChevronLast,
  MoreVertical,
  LogOut, // Re-import LogOut icon
} from 'lucide-react';

const SidebarContext = createContext<{ expanded: boolean }>({ expanded: true });

const menuItems = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/kasir', icon: <ShoppingCart size={20} />, label: 'Kasir' },
  {
    path: '/products',
    icon: <Package size={20} />,
    label: 'Produk',
    adminOnly: true,
  },
  { path: '/customers', icon: <UserCircle size={20} />, label: 'Customer' },
  { path: '/reports', icon: <BarChart3 size={20} />, label: 'Laporan' },
  {
    path: '/users',
    icon: <Users size={20} />,
    label: 'Pengguna',
    adminOnly: true,
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { user, logout } = useAuth(); // Destructure user and logout
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout functionality
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="h-screen fixed">
        <nav className="h-full flex flex-col bg-white border-r shadow-sm">
          <div className="p-4 pb-2 flex justify-between items-center">
            <img
              src="https://img.logoipsum.com/243.svg"
              className={`overflow-hidden transition-all ${
                expanded ? 'w-32' : 'w-0'
              }`}
              alt=""
            />
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              {expanded ? <ChevronFirst /> : <ChevronLast />}
            </button>
          </div>

          <SidebarContext.Provider value={{ expanded }}>
            <ul className="flex-1 px-3">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  text={item.label}
                  path={item.path}
                  adminOnly={item.adminOnly}
                />
              ))}
            </ul>
          </SidebarContext.Provider>

          <div className="border-t flex p-3">
            <img
              src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
              alt=""
              className="w-10 h-10 rounded-md"
            />
            <div
              className={`
              flex justify-between items-center
              overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}
          `}
            >
              <div className="leading-4">
                <h4 className="font-semibold">{user?.fullName || 'User'}</h4> {/* Display user's full name */}
                <span className="text-xs text-gray-600">
                  {user?.role || 'Role'}
                </span> {/* Display user's role */}
              </div>
              <MoreVertical size={20} />
            </div>
          </div>
          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className={`
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group w-full
                text-red-600 hover:bg-red-50
            `}
            >
              <LogOut size={20} />
              <span
                className={`overflow-hidden transition-all ${
                  expanded ? 'w-52 ml-3' : 'w-0'
                }`}
              >
                Logout
              </span>
              {!expanded && (
                <div
                  className={`
                    absolute left-full rounded-md px-2 py-1 ml-6
                    bg-indigo-100 text-indigo-800 text-sm
                    invisible opacity-20 -translate-x-3 transition-all
                    group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                `}
                >
                  Logout
                </div>
              )}
            </button>
          </div>
        </nav>
      </aside>
      <main
        className={`transition-all ${
          expanded ? 'ml-64' : 'ml-20'
        } w-full h-screen`}
      >
        {children}
      </main>
    </>
  );
}

export function SidebarItem({
  icon,
  text,
  path,
  adminOnly = false,
}: {
  icon: React.ReactNode;
  text: string;
  path: string;
  active?: boolean;
  adminOnly?: boolean;
}) {
  const { expanded } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = location.pathname === path;

  if (adminOnly && user?.role !== 'ADMIN') return null;

  return (
    <li
      onClick={() => navigate(path)}
      className={`
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${
          isActive
            ? 'bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800'
            : 'hover:bg-indigo-50 text-gray-600'
        }
    `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all ${
          expanded ? 'w-52 ml-3' : 'w-0'
        }`}
      >
        {text}
      </span>

      {!expanded && (
        <div
          className={`
          absolute left-full rounded-md px-2 py-1 ml-6
          bg-indigo-100 text-indigo-800 text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
        >
          {text}
        </div>
      )}
    </li>
  );
}
