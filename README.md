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
                : if OTP validty check is done successfully, alert message pops up
                  (Assume that, that is a pairing code which is shown in device's screen)
            (5) Enter Pairing Code
                : Enter Pairing Code and click PAIRING button
                : if pairing process is failed, you can not use lock/unlock function
                : if (3)'s user information or vehicles' information are entered wrong,
                  can not perform Pairing properly  (negative test)              
            (6) Lock/Unlock
                : Click lock, unlock button
                : if (3)'s user information or vehicles' information are entered wrong,
                  can not perform Lock/Unlock properly  (negative test)

   #4. etc
   
   
        - if you want to volume option for persistent storage,
           comment out volume in docker-compose.yml



- to do list
    1. Pairing session timeout error functionality
    2. Reset usability flag functionality
