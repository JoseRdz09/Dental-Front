
import { BrowserRouter } from "react-router-dom";
import AppRouter from "../src/app/router";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
