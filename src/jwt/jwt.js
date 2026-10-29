import jwt from 'jsonwebtoken'



// creating jwt  and storing on the browser cookie
const createTokenAndSaveCookie = ({ userId, res }) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    })


    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    })
}


export default createTokenAndSaveCookie;