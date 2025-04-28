import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";
import {
  MdDashboard,
  MdPeople,
  MdRestaurant,
  MdShoppingCart,
  MdLogout,
  MdPerson,
} from "react-icons/md";

const adminLinks = [
  { name: "Dashboard", path: "/admin", icon: <MdDashboard /> },
  { name: "Users", path: "/admin/users", icon: <MdPeople /> },
  {
    name: "Restaurant Management",
    path: "/admin/restaurant-management",
    icon: <MdRestaurant />,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: <MdShoppingCart />,
  },
];

const restaurantAdminLinks = [
  { name: "Dashboard", path: "/restaurant-admin", icon: <MdDashboard /> },
  { name: "Profile", path: "/restaurant-admin/profile", icon: <MdPerson /> },
];

const Sidebar = ({ role }) => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const links = role === "admin" ? adminLinks : restaurantAdminLinks;

  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed">
      {/* Role-specific Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">
          {role === "admin" ? "Admin Panel" : "Restaurant Admin"}
        </h1>
      </div>

      {/* Links */}
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`flex items-center p-2 rounded-lg hover:bg-gray-700 ${
                  location.pathname === link.path ? "bg-gray-700" : ""
                }`}
              >
                <span className="material-icons mr-3">{link.icon}</span>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo Section and Logout Button */}
      <div className="absolute bottom-0 w-full p-4">
        {/* Logo Section */}
        <div className="border-t border-gray-700 pt-4 mb-4">
          <img
            src="/TastyTrail.png" // Replace with your logo image path
            alt="Logo"
            className="h-50 w-auto mx-auto" // You can adjust the size and styling of the logo here
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-red-600 hover:bg-red-700"
        >
          <span className="material-icons mr-2">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;