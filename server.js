const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const presentation = require('./presentation');

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI, {https://github.com/amna0712/Web2Project/blob/main/server.js
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/auth', presentation);  //  

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
