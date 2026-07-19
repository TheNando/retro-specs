import { render } from "preact";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app.tsx";
import { queryClient } from "./client/queryClient.ts";
import "./index.css";

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!
);
