import { BrowserRouter, Routes, Route } from "react-router-dom"
import Footer from "./components/footer"
import Navbar from "./components/navbar"
import Home from "./pages/home"
import About from "./pages/about"
import Stocks from "./pages/stocks"
import Page4 from "./pages/clothing"
import Page5 from "./pages/watches"
import Counterstrike from "./pages/counterstrike"

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/clothing" element={<Page4 />} />
        <Route path="/watches" element={<Page5 />} />
        <Route path="/counterstrike" element={<Counterstrike />} />
      </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

