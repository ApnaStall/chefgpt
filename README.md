👨‍🍳 ChefGPT
Cloud-Based Data-Driven Recipe Generator & Nutrition Tracker

📌 Overview

ChefGPT is a full-stack cloud-native web application that generates personalized recipes based on available ingredients and tracks daily nutritional intake. The system leverages Python backend logic, a MySQL relational database, and AWS cloud infrastructure for scalable deployment.

🛠️ Tech Stack

• Backend: Python (Flask/Django)
• Database: MySQL
• Cloud: AWS EC2 / ECS, AWS RDS, AWS S3
• Frontend: HTML, CSS, JavaScript
• AI Logic: Custom Generative Logic (Ingredient-based Recipe Suggestion)

✨ Key Features

🔐 User Authentication (Signup/Login)
🥗 Ingredient-Based Recipe Suggestions
📊 Daily Nutrition Tracking
🗂️ Structured Relational Database
☁️ Cloud Deployment using AWS
🖼️ Recipe Image Storage via S3
🗄️ Database Schema Design

The system uses a normalized relational schema including:

• Users
• Recipes
• Ingredients
• Recipe_Ingredients
• User_Logs
• Designed to support optimized relational queries and user personalization.

☁️ Cloud Architecture

• Application hosted on AWS EC2 / ECS
• Managed MySQL database via AWS RDS
• Static assets and images stored in AWS S3

🧠 AI-Based Recommendation Logic

ChefGPT includes a basic generative concept that:
• Accepts user-provided ingredients
• Matches them with stored recipes
• Identifies missing ingredients
• Suggests alternatives for substitutions

🚀 Future Enhancements

• Integration with LLM APIs (OpenAI / HuggingFace)
• Docker Containerization
• CI/CD Pipeline Implementation
• Admin Dashboard
• Advanced Nutritional Analytics

📈 Resume Highlights

• Designed and optimized a normalized MySQL schema for relational data handling.
• Deployed a cloud-native Python application using AWS EC2 and RDS.
• Implemented AI-inspired ingredient-based recommendation logic.
• Built secure authentication and session management system.
