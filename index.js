const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

const authRouter = require("./routes/authRouter");
const postRouter = require("./routes/postRouter")

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

mongoose.connect(process.env.URI).then(() => {
    console.log("Database connected");
})
.catch((err) =>{
    console.log(err);
});

app.use('/api/auth', authRouter);
app.use('/api/post', postRouter);

app.get("/", (req, res) => {
    res.json({
        message: "Hello ngvdung"
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on PORT ${process.env.PORT}`)
})