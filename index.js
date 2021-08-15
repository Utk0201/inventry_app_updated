const express=require('express');
const app=express();
const mongoose=require('mongoose');
const methodOverride=require('method-override');
const AppError=require('./AppError');
const flash=require('connect-flash');
const session=require('express-session');
const path = require('path');

const sessionOptions={secret:'aBadSecret',resave:false,saveUninitialized:false}
app.use(session(sessionOptions));

//importing files from product.js in models directry
const Product=require('./models/product');
const Farm=require('./models/farm');

mongoose.connect('mongodb://localhost:27017/flashDemo', {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log('MONGO CONNECTED');
})
.catch((e)=>{
    console.log('MONGO Error!!');
    console.log(e);
})

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
//requiring method override

app.use(express.static('assets'));      //  middleware to use static files
app.use(flash());   //now req has a method called '.flash'
app.use((req,res,next)=>{
    res.locals.message= req.flash('success');
    next(); //now i have access to every template
})

app.use(express.urlencoded({extended:true}))
//using method override middleware
app.use(methodOverride('_method'));


const categories=['fruits','vegetables','dairy']

//FARM ROUTES

app.delete('/farms/:id',async (req,res)=>{
    // console.log('deleting');
    const farm=await Farm.findByIdAndDelete(req.params.id);
    res.redirect('/farms');
})

app.get('/farms',async (req,res)=>{
    // console.log('ok till now');
    const farms=await Farm.find({});
    // res.render('farms/index',{farms,message:req.flash('success')});
    res.render('farms/index',{farms});  //we don't need to write message exclusively
    //as we have included req.flash(success) in line 32
    // res.send('ok')
})

app.get('/farms/new',(req,res)=>{
    res.render('farms/new');
})

app.get('/farms/:id',async (req,res)=>{
    const {id}= req.params;
    // const farm=await Farm.findById(id); //uptill now, in farm.products array, we see only object id
    //however, we want to access other properties of products also
    //so, we need to populate the array
    const farm=await Farm.findById(id).populate('products');
    // console.log(farm);
    res.render('farms/show',{farm});
})

app.post('/farms',async (req,res)=>{
    // res.send(req.body);
    const farm=new Farm(req.body);
    await farm.save();
    req.flash('success','Successfully created a farm');
    res.redirect('/farms');
})

app.get('/farms/:id/products/new',async (req,res)=>{
    const {id}=req.params;
    const fr=await Farm.findById(id);
    res.render('products/new',{categories,fr});
})

app.post('/farms/:id/products',async (req,res)=>{
    // res.send(req.body);
    //to associaye below product with farm, grab farm id
    const {id}=req.params;
    const fr=await Farm.findById(id);
    const {name,price,category}=req.body;
    const prod=new Product({name,price,category}); //shortcut to make product model
    fr.products.push(prod);
    prod.farm=fr;
    await fr.save();
    await prod.save();
    // res.send(fr);
    res.redirect(`/farms/${fr._id}`);   //fr._id is written instead of id in order to be more specific
    //so that no confusion arises with regard to definition of id
})

//PRODUCT ROUTES
app.get('/products',wrapAsync(async (req,res,next)=>{
    const products=await Product.find({});
    // console.log(products);
    // res.send('ok!');
    const {category}=req.query;
    if(category){
        //check whether req.body works fine
        const products=await Product.find({category})
        // console.log(products);
        res.render('products/index.ejs',{products,category});
    }
    else{
        const products=await Product.find({})
        // console.log(products);
        res.render('products/index.ejs',{products,category:'All'});
    }
    // console.log('This line also executes!!');
    // res.send('All products r here!!');
}))

//this one takes you to the forms
app.get('/products/new',wrapAsync((req,res)=>{
    // throw new AppError(401,'Not allowed');
    res.render('products/new',{categories});
}))

app.post('/products',wrapAsync(async (req,res)=>{
    const newPrd=new Product(req.body);
    await newPrd.save();  //This line takes time  so
    //await it
    res.redirect(`/products/${newPrd._id}`);
}))

//using below function to catch errors(if any) 
//and pass it to next function
function wrapAsync(fn){
    return function(req,res,next){
        fn(req,res,next).catch(e=> next(e));
    }
}

//to look for unique products
app.get('/products/:id',wrapAsync(async(req,res,next)=>{
    const {id}=req.params;
//req.body also works fine
const fnd=await Product.findById(id).populate('farm','name');
console.log(fnd);
if(!fnd){
    throw new AppError(404,'Product not found');
    // return next(new AppError(404,'Product not found'));
    //if we give error code 101 the above line doesn't work
    // above line doesn't work in asynchronous functions
    // so use next
    // return next(new AppError(101,'Product not found'));
}
res.render('products/show',{fnd});
// res.send('details page');
}))



//first,we have to extract the product
app.get('/products/:id/edit',wrapAsync(async (req,res,next)=>{
        const {id}=req.params;
    const product=await Product.findById(id);
    if(!product){
        return next(new AppError(404,'Product not found'));
        //if we give error code 101 the above line doesn't work
        // above line doesn't work in asynchronous functions
        // so use next
        // return next(new AppError(101,'Product not found'));
    }
    res.render('products/edit',{product,categories});

}))
//updating product
//in form,we can't directly make a put request
//so, we have to use method override
app.put('/products/:id',wrapAsync(async(req,res,next)=>{
    const {id}=req.params; //shorter way of telling 
    //Below line includes old info also
    //so, we set new:true
    // const changedProd=Product.findByIdAndUpdate(id,req.body,{runValidators:true});
    const changedProd=await Product.findByIdAndUpdate(id,req.body,{runValidators:true,new: true});
    //findByIdAndUpdate doesn't run validation by default
    //so,we set it to true
    res.redirect(`/products/${changedProd._id}`)
    res.send('Put!!');
}))

//deleting products
app.delete('/products/:id',wrapAsync(async (req,res)=>{
    // res.send('you made it!');
    const {id}=req.params;
    const deletedProd= await Product.findByIdAndDelete(id);
    res.redirect('/products');
}))

////////////////////////////////////////////////////////////////////
const handleValidationErr=err=>{
    // console.dir(err);
    return new AppError(503,`Validation error!!! ${err.message}`);
}

//to display error name
app.use((err,req,res,next)=>{
    console.log(err.name);
    if(err.name==='ValidationError') err= handleValidationErr(err);
    next(err);
})

//adding our customised error handling middleware
app.use((err,req,res,next)=>{
    const {status=500,message='Something wrong'}=err;
    res.status(status).send(message);
})

//features i added
//to deleteAll
// app.get('/deleteAll',(req,res)=>{

// })

app.listen(3000,function(){
    console.log('App is listening on 3000');
})

