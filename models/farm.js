const mongoose=require('mongoose');
const {Schema}=mongoose;

const product=require('./product');

//declare new schema
const farmSchema=new Schema({
    name:{
        type:String,
        required:[true,'Farm must have a name']
    },
    city:{
        type:String,

    },
    email:{
        type:String,
        required:[true,'Please enter city']
    },
    products:[
        {
            type:Schema.Types.ObjectId,
            ref:'Product'   //map farm to products 
        }
    ]
})

farmSchema.post('findOneAndDelete',async function(farm){
    if(farm.products.length){
        const res=await product.deleteMany({_id:{$in:farm.products}});
        console.log(res);
    }
})

module.exports=new mongoose.model('Farm',farmSchema);
