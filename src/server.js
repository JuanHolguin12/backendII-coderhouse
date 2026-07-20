import app from "./app.js";
import { config } from "./config/config.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Servidor corriendo en el puerto ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error("Error al iniciar el servidor:", error.message);
  process.exit(1);
});
