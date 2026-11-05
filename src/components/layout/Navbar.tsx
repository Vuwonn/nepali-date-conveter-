import { Link } from "react-router";
import { CalendarDays, CalendarSync, House, Info, Menu, X } from 'lucide-react';
import { useState } from "react";

const links = [
  { to: "/", label: "Home", icon:<House/> },
  { to: "/converter", label: "Date Converter", icon:<CalendarSync/> },
  { to: "/patro", label: "Nepali Patro", icon:<CalendarDays/> },
  { to: "/about", label: "About", icon:<Info/> },
];

const Navbar = () => {
const[openMenu,setOpenMenu]=useState(false)
  return (
    <nav className="border-b bg-white relative">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-blue-600 w-fit">
          Nepali Patro
        </Link>

        <div className=" flex-wrap hidden sm:flex sm:gap-6">
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
{/* Hamburger Menu  */}
<div onClick={()=>setOpenMenu(true)} className="sm:hidden cursor-pointer h-fit w-fit">
<Menu/>
</div>
      </div>
{
openMenu && (
<div className="fixed sm:hidden top-0 right-0 h-screen z-10 border w-full bg-black/30 flex justify-end">
<div className="w-[60%] h-full bg-white">
<div className="flex justify-between items-center border-b border-gray-500 pr-3 pl-5 py-4 mx-auto">
<h1 className="font-semibold text-xl">Menu</h1>
<div onClick={()=>setOpenMenu(false)} className="h-7 w-7 cursor-pointer hover:bg-black/10 transition-all duration-300 rounded-full flex items-center justify-center">
<X size={20}/>
</div>
</div>
<div className="flex flex-col">
          {links.map((link) => (
            <Link
onClick={()=>setOpenMenu(false)}
              key={link.to}
              to={link.to}
              className="flex gap-2 px-4 py-4 border-b border-gray-500 mx-3 text-gray-700 hover:text-blue-600"
            >
{link.icon}
              {link.label}
            </Link>
          ))}
        </div>
</div>
</div>
)
}
    </nav>
  );
};

export default Navbar;
