const mongoose=require('mongoose');

const Product=require('./models/product');


mongoose.connect('mongodb://localhost:27017/farmApp', {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log('MONGO CONNECTED');
})
.catch((e)=>{
    console.log('MONGO Error!!');
    console.log(e);
})

const p=new Product({
    name:'Grapes',
    price:1.5,
    category: 'fruit'
})

p.save()
.then(p=>{
    console.log(p)
})
.catch(e=>{
    console.log(e)
})