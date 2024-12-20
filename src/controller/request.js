const {ConnectionRequest} = require('../models/connectionRequest') ;

const User = require('../models/user');

const mongoose = require('mongoose');


// send connection request
const requestSend = async (req,res) => {
  try {
    
    // logged user is actually sending connection request (fromUser)
    const fromUserId = req.user._id ;
    // toUserId we can get from req.params
    const toUserId = req.params.toUserId ;


    // Validate toUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    // check the user with toUserId
    const toUser = await User.findById(toUserId) ;

    if(!toUser) {
      return res
      .status(400)
      .json({message:'requested user is not found'}) ;
    }

    const status = req.params.status ;

    const allowedStatus = ["ignored","interested"] ;
    if(!allowedStatus.includes(status)) {
      return res
      .status(400)
      .json({message:'status is not allowed'}) ;
    }

    // check the connectionRequest is already exist or not
    const existConnectionRequest = await ConnectionRequest.findOne({$or:[
      { fromUserId,toUserId },
      { fromUserId : toUserId , toUserId : fromUserId },
    ]})

    if(existConnectionRequest) {
      return res.send('connection request already send..!') ;
    }

    // creating document
    const ConnectionData = new ConnectionRequest({
      fromUserId ,
      toUserId ,
      status
    })

    await ConnectionData.save() ;

    console.log(ConnectionData) ;

    res.send("connection request send successfully") 

  } catch (err) {
    res
      .status(400)
      .json({message:err.message}) ;
    console.log('something went wrong!'+err.message) ;
  }
}

// review connection request
const requestReview = async (req,res) => {
  try {
    
    const loggedInUserId = req.user._id.toString() ;
    console.log(loggedInUserId) ;

    const { status , requestId } = req.params ;

    const allowedStatus = ["accepted","rejected"] ;
    const isValidStatus = allowedStatus.includes(status) ;

    if(!isValidStatus) {
      return res
                .status(404)
                .json({
                  message : "invalid status"
                })
    }

    const request = await ConnectionRequest.findOne({
      _id : requestId ,
      toUserId : loggedInUserId,
      status : "interested"
    }) ;

    console.log(request) ;

    if(!request) {
      return res
                .status(400) 
                .json({
                  message : "request is not found"
                })
    }

    // change the status value to accepted or rejected basis on the request
    request.status = status ;

    const updatedData = await request.save() ;

    console.log('updated Data :',updatedData) ;

    res.json({
      message : "request was" + status 
    })


  } catch (err) {
    res.json({
      message : "something went wrong!" + err.message
    })
  }
}

module.exports = { requestSend ,
                   requestReview             
                }