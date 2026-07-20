import app from "./app.js";
import { config } from "./config/config.js";

app.listen(config.port, () => {
  console.log(`Servidor corriendo en el puerto ${config.port}`);
});
