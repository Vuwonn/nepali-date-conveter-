import { Route, Routes } from "react-router"
import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import About from "./pages/About"
import DateConverter from "./pages/DateConverter"
import NepaliPatro from "./pages/NepaliPatro"

const App = () => {
  return (

      <Routes>
             <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/converter" element={<DateConverter />} />
        <Route path="/patro" element={<NepaliPatro />} />
        <Route path="/about" element={<About />} />
      </Route>
      </Routes>

  )
}

export default App