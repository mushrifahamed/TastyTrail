import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar";

const Layout = ({ role }) => {
  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-64 p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
