// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { CommandPaletteProvider } from "./Context/CommandPaletteContext";
import { OrderModalProvider } from "./Context/OrderModalContext";
import { HomeCollectionModalProvider } from "./Context/HomeCollectionModalContext";
import AppRoutes from "./Routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommandPaletteProvider>
          <OrderModalProvider>
            <HomeCollectionModalProvider>
              <AppRoutes />
            </HomeCollectionModalProvider>
          </OrderModalProvider>
        </CommandPaletteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;