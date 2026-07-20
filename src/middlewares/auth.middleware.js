import passport from "passport";

export const auth = (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const statusCode = info?.statusCode || 401;
      const message = info?.statusCode ? info.message : "No autenticado";
      return res.status(statusCode).json({ status: "error", message });
    }

    req.user = user;
    next();
  })(req, res, next);
};
