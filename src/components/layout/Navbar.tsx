import { Link } from "react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/converter", label: "Date Converter" },
  { to: "/patro", label: "Nepali Patro" },
  { to: "/about", label: "About" },
];

const Navbar = () => {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Nepali Patro
        </Link>

        <div className="flex flex-wrap gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-700 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
