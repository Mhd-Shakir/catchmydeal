import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import logo from "../../assets/pocketmoney_logo.png"

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="w-32 sm:w-36 md:w-40 lg:w-44 mb-6">
              <img src={logo} alt="Pocket Money Logo" className="w-full h-auto object-contain" />
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Pocketmoney All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;