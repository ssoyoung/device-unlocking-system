# device-unlocking-system
PoC code for device(scooter) lock/unlock system

- How to install & run


   #1. Run docker compose build
>       $ docker-compose build

   #2. Run docker compose up
>       $ docker-compose up

        ** caution
        - there are 3 mongo db (for transaction & watch)
            - but watch function is not implemented this time (TO-DO)
        - time is needed to run all process successfully
            - when you see below message in console, youn can use device-unlocking-system
            
            unlocking-server  | success to connect mongo DB!

   #3. Go to client website for test
        
        - Enter http://localhost:3000 in browser
        
        
        - you can use below functionality
        
            (1) User Account Creation
                : Create new user (user duplication check)
            (2) Vehicle Creation
                : Create new vehicle (vehicle duplication check)
            (3) Get OTP
                : Get OTP Code for user (maximum 3 times)
            (4) Enter OTP
                : OTP validty check (maximum 3 times)

   #4. etc
   
   
        - if you want to volume option for persistent storage,
           comment out volume in docker-compose.yml



- to do list
    1. Pairing code connection
    2. Reset usability flag functionality
    3. Lock/Unlock functionaility
    4. Implement watch function in mongodb
