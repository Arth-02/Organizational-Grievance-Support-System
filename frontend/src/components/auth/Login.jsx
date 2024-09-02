import { Button } from "../ui/button"

const Login = () => {
  return (
    <>
        <div className="w-screen h-screen flex justify-center items-center">
            <div className="flex justify-center items-center bg-graybackground text-foreground p-5 rounded-xl">
                <img src="images/login-vector.png" alt="logo" className="w-[500px] h-[500px]"/>
                <div className="form-wrapper shadow-2xl p-4 bg-background rounded-xl">
                    <h1 className="text-center text-4xl font-bold m-5">Welcome!</h1>
                    <form className="min-w-[300px]">
                        <div className="flex flex-col gap-2 p-2 my-3">
                            <label htmlFor="email">Email/Username</label>
                            <input type="email" id="email" placeholder="Email" />
                        </div>
                        <div className="flex flex-col gap-1 p-2 my-3">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="Password" /> 
                        </div>
                        <Button type="submit" className="w-full">Login</Button>
                    </form>
                </div>
            </div>
        </div>
    </>
  )
}

export default Login