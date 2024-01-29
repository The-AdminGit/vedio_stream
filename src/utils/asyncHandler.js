//another way code

const asyncHandler = (requestHandler) =>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next((err)))
    }
}

export {asyncHandler}



//one method in production
// const asyncHandler = (fun) => async(req, res, next)=>{
//     try {
//         await fun(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }