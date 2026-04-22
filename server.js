const express = require('express');
const app = express();
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = require('stripe')(stripeSecretKey);
app.use(express.json());

const fs = require('fs');
const PORT = 3000;


app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/store', async (req, res) => {
  fs.readFile("items.json", function(error, data) {
    if (error) res.status(500).end();
    else res.render('store.ejs', {
      stripePublicKey: stripePublicKey,
      items: JSON.parse(data)
    })
  })
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Test Product'
          },

          unit_amount: 2000,
        },
        quantity: 1,
      }],

      success_url: 'http://localhost:3000/store?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/store'
    })

    res.json({ id: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/store', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id
  );

  if (session.payment_status === 'paid') {
    res.status(200).send({ message : "Payment Successful" });
  } else {
    res.status(404).send({ message : "Payment Failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is Running Now ${PORT}`);
})