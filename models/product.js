 const mongoose=require('mongoose');
 const {Schema}=mongoose;

//defining properties of our model
 const productSchema=new Schema({
     name:{
         type: String,
         required: [true,'Name must be mentioned!!']
         //2nd element of above array is a string and is displayed during validation error
     },
     price:{
         type: Number,
         required: true,
         min: 0
     },
     category:{
         type: String,
         lowercase:true,
         enum: ['fruits','vegetables','dairy']
     },
     farm:{
         type: Schema.Types.ObjectId,
         ref:'Farm'    //map  products to farm
     }
 })

 //compiling our model
//  const Product=mongoose.model('Product');
//If we write above line, then compiler doesn't know the
//properties of Product
 const Product=mongoose.model('Product',productSchema);

module.exports=Product;