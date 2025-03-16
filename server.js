require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const presentation = require('./presentation');

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use('/auth', presentation);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
