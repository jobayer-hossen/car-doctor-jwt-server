const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 9000;

// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hxrsyqo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJwt = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorize'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.JWT_TOKEN ,(error , decoded)=>{
    if(error){
      return res.send({error:true,message:'unauthorize'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db('carDoctor').collection('service');
    const bookingCollection = client.db('carDoctor').collection('booking');

    // jwt

    app.post('/jwt', (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_TOKEN,{expiresIn:'7d'});
      res.send({token});
    })

    app.get('/services' , async(req,res)=>{
      const cursor = serviceCollection.find() ;
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const options = {
        projection : { title : 1 , price: 1 , service_id: 1 , img:1 , date :1}
      }
      const result = await serviceCollection.findOne(query , options);
      res.send(result);
    })

    // booking
    app.post('/bookings',  async(req,res)=>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/bookings', verifyJwt,  async(req,res)=>{
      const decoded = req.decoded;
      console.log(req.query.email);
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }
      let query = {}
      if(res.query?.email){
        query={query:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);



     })

     app.delete('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
     })

     app.put('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateBooking = req.body;
      const updateDoc={
        $set:{
          status: updateBooking.status
        },
      }
      const result = await bookingCollection.updateOne(filter,updateDoc);
      res.send(result)

     })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/' , (req,res)=>{
    res.send('doctor is running')
})
app.listen(port,()=>{
    console.log(`Doctor server running port${port}`)
})