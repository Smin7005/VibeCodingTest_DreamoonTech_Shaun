# Scope

## 1. Must Have

### 1.1 User registration module

- Configuring 'ClerkProvider' component in global layout.
- Using 'SignIn', 'SignUp' or other corresponding routing components provided by Clerk.

#### 1.1.1 Sign-in page

- 1.1.1.1 To ask user type in existing account email address and password.
- 1.1.1.2 To validate user's email and password.
- 1.1.1.3 Requiring user clicks on continue button to sign-in.
- 1.1.1.4 If account email input cannot match to platform database, ask user to create a new account.
- 1.1.1.5 If account password input cannot match to platform database, ask user to type in the correct password, or create a new password.
- 1.1.1.6 Allowing users to sign-in by their Google account.

#### 1.1.2 Sign-up page

- 1.1.2.1 To ask users type in their email address for creating account, and send the validation code to user's email.
- 1.1.2.2 To ask user create a password, allow google password manager to autofill a new password when user agreed.
- 1.1.2.3 To ask users repeat their password, and match the passwords inputs of both times.
- 1.1.2.4 To ask user type in validation code, and then compare the value of validation code.
- 1.1.2.5 Allowing users to sign-up by their Google account.
- 1.1.2.6 After user finish all the inputs and click on finish button, store the account email address and password to platform database.
- 1.1.2.7 If validation code is incorrect, platform sends another validation code and ask user to type in again.

### 1.2 Onboarding flow

- Platform must record the user behaviours, and store all the value to database.
- Platform moves users to next step automatically after they finish a 'main step'. For instance, after they 'Sign-up new account', or after they 'Upload resume'.

#### 1.2.1 Flow for guests:

- 1.2.1.1 This onboarding flow must be implemented on landing page.
- 1.2.1.2 There are 4 main steps in total.
- 1.2.1.3 Sign-up new account: Email, Password, Password confirmation, Validation code.
- 1.2.1.4 Fill-in basic information: Name, Role, Target position, City.
- 1.2.1.5 Upload resume: Also allow users to upload multiple times if they submit the wrong file, with a medium size window for preview purpose.
- 1.2.1.6 Provide analysis result: By using Claude Code API including basic information, skills and expertises, working and internship experiences.
- 1.2.1.7 After users finished all main steps, update their 'User type' to 'Free user'.
- 1.2.1.8 Platform will only starts the 'Dashboard introduction' once user click on 'Dashboard' button.
- 1.2.1.9 This onboarding flow should be implemented by 'React stepper component' or corresponding components.

#### 1.2.2 Flow for free users:

- 1.2.2.1 This onboarding flow should be started at the first time when users enter the 'Dashboard'.
- 1.2.2.2 There are 5 main steps in total.
- 1.2.2.3 Fill-in basic information: Name, Role, Target position, City, and this step is skippable if user already finished.
- 1.2.2.4 Upload resume: Also allow users to upload multiple times if they submit the wrong file, with a medium size window for preview purpose, and this step is skippable if user already finished.
- 1.2.2.5 Provide analysis result: By using Claude Code API including basic information, skills and expertises, working and internship experiences, and this step is skippable if user already finished.
- 1.2.2.6 Dashboard introduction: Welcome header, Onboarding guide, Resume information, Subscription states, and Statistics block.
- 1.2.2.7 Purchase navigation: to navigate users click on a button for upgrading their current plan, then jump to the 'User purchase module' built by Stripe. Also, allow user to cancell this step with one-click at anytime.
- 1.2.2.8 If users made their purchase, update their 'User type' to 'Member'.

### 1.3 Resume management module

- Calling the Claude Code API to implement resume analysis function.

#### 1.3.1 Resume review and management

- 1.3.1.1 To fix the grammar error in uploaded resume.
- 1.3.1.2 To fix the spelling error in uploaded resume.
- 1.3.1.3 After the review steps, store user's resume as pdf version into database.

#### 1.3.2 Resume information analysis

- 1.3.2.1 To collect the basic information from user's resume, including name, phone number, email address, and home address.
- 1.3.2.2 To collect all the skills and expertises information from user's resume, then generate each skill and expertise as values.
- 1.3.2.3 To collect all working and internship experiences from user's resume, then generate each working and internship experiences as values.
- 1.3.2.4 Storing all the informations to database.

### 1.4 User dashboard module

- 'Dashboard' and related routes must be login protected.
- Gathering values from platform database before outputs.

#### 1.4.1 Welcome header

- 1.4.1.1 To output user's full name.
- 1.4.1.2 To demonstrate a progress pie chart about profile compeletion.

#### 1.4.2 Onboarding guide

- 1.4.2.1 To demonstrate the current step, and also demonstrate the complete steps and incomplete steps.
- 1.4.2.2 Users can jump to the relative step by one-time click on step tags.

#### 1.4.3 Resume information

- 1.4.3.1 To ouput the name, email address, and phone number by 'header' or similar element.
- 1.4.3.2 To ouput the skills and expertises by 'tag' or similar element.
- 1.4.3.3 To ouput the working and internship experiences by 'ordered list' or similar element.
- 1.4.3.4 Integrating all the informations, and create the result of analysis by the 'React card' or similar component.
- 1.4.3.5 To provide a button to resubmit user's resume, after the submission, do the analysis again, and cover the previous result.

#### 1.4.4 Subscription states

- 1.4.4.1 If user is free user, platform shows 'Free Plan' and a button to upgrade user's plan must be set alongside.
- 1.4.4.2 If user is member, platform shows current plan information, including level, bill cycle and deduction date of current plan.
- 1.4.4.3 To provide a subscription management button, after user clicks on it, jump to purchase page.

#### 1.4.5 Statistics block

- 1.4.5.1 To output the number of user's skills and expertises.
- 1.4.5.2 To output the number of user's working and internship experiences.

### 1.5 User purchase module

- 1.5.1 Building this module by the 'Stripe Billing' in test mode.

- 1.5.2 To create a 'upgrade plan' button in the front end.

- 1.5.3 Setting the 'Stripe Portal Redirect Link' to update the user's subscription states after user's purchase.

- 1.5.4 To provide 'switch plan' and 'cancell subscription' logic for users.

## 2. Should Have

### 2.1 Cover letter generation

- 2.1.1 Users can generate a cover letter that matched the jobs they applied.

### 2.2 Multiple one-click sign-in and sign-up options

- 2.2.1 LinkedIn
- 2.2.2 WhatsApp
- 2.2.3 Discord
- 2.2.4 Atlassian

### 2.3 Account management on 'Dashboard'

- 2.3.1 Allowing user to change password.
- 2.3.2 Allowing user to change email.

## 3. Not Have

### 3.1 Functions about recruitment and related implementation.

### 3.2 Functions about community services.
