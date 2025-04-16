import Sidebar from "./layout/Sidebar";

const Layout = ({ children, role }) => {
  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-64 p-6">{children}</div>
    </div>
  );
};

export default Layout;
