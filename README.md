# device-unlocking-system
- What is this project about?

   : Device(vehicle) lock/unlock system. It includes below functionalities...

   :  Create User with phone number / Create Vehicle Device with unique ID /
      Get OTP from server / OTP matching checker /
      Get Pairing Code from server (automatically performed after OTP matching checker is done) / Send Pairing Code to server / Device lock, unlock

- Which skills are used?

   REST API call, socket.io, mongo DB (+mongoose), docker


- How to install & run

   
   
STEP 1. Run docker compose build (where docker-compose.yml file exists)
>       $ docker-compose build

   STEP 2. Run docker compose up (where docker-compose.yml file exists)
>       $ docker-compose up

        ** caution
        - there are 3 mongo db (for transaction & watch)
            - but watch function is not implemented this time (TO-DO)
        - time is needed for all docker containers to be run successfully
            - when you see below message in console, you can use device-unlocking-system
            
            unlocking-server  | success to connect mongo DB!
         - If still not working, restart unlocking-server container once again(1), or restart all containers (2)
            (1) restart unlocking-server container
                $ docker unlocking-server restart

            (2) restart all containers
                $ docker-compose down
                $ docker-compose up

   STEP 3. Go to client website for test
        
        - Enter http://localhost:3000 in browser
        
        
        - you can use below functionality
        
            (1) User Account Creation
                : Create new user (user duplication check)
                : Enter user information and click "CREATE" button
                
            (2) Vehicle Creation
                : Create new vehicle (vehicle duplication check)
                : Enter vehicle information and click "CREATE" button
                
            (3) Get OTP
                : Get OTP Code for user (maximum 3 times)
                : Enter user information and click "GET OTP" button 
                
            (4) Enter OTP
                : OTP validty check (maximum 3 times)
                : Enter OTP information and click "SEND OTP" button
                : if OTP validty check is done successfully, alert message pops up
                  (Assume that, that is a pairing code which is shown in device's screen)
                : if (3)'s user information or vehicles' information are entered wrong,
                  can not perform Pairing properly  (negative test)              

            (5) Enter Pairing Code
                : Enter Pairing Code and click PAIRING button
                : if pairing process is failed, you can not use lock/unlock function
                : if (3)'s user information or vehicles' information are entered wrong,
                  can not perform Pairing properly  (negative test)
                : Pairing code is valid during 2 minutes
                  (if 2 minutes passed, user can not access to the system, and reset(7) is needed)
                  
            (6) Lock/Unlock
                : Click lock, unlock button
                : if (3)'s user information or vehicles' information are entered wrong,
                  can not perform Lock/Unlock properly  (negative test)
                  
            (7) Reset
                : You can use this function if user is in condition, excess 3 times wrong OTP entered problem
                : Enter the user information (phone number), and vehicle information if needed

   etc.
   
   
        - if you want to volume option for persistent storage,
           comment out volume in docker-compose.yml file


   Q. I am a developer. How to use the APIs for this system?

   A. Reference code is in index.html file.
      But I will write about it with much more details as soon as possible.


- to do list
    1. Code Refactoring & Stablization
    2. Unit test code (Behavioral Driven Testing)
    3. API Doxygen
