import { app } from "./app/app.js";
import {
  logRequest,
  versionCheckMiddleware,
} from "./middleware/auth.middleware.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import router from "./routes/router.js";
import connectDatabase from "./config/database.js";
import { io } from "./socket/socket.js";
import { initCronJobs } from "./app/cron.js";
import { hostnameCheck } from "./utils/helper.js";
import routerV2 from "./v2Router/routerV2.js";

router.get("/health", (req, res) => {
  return res.status(200).send("OK");
});

app.use(hostnameCheck);
app.use(logRequest);
// app.use(versionCheckMiddleware);
app.use("/", router);
app.use("/v2", routerV2);

app.use(notFound);
app.use(errorHandler);

connectDatabase();
initCronJobs();
