#!/usr/bin/env python3
"""
Quick start script for Vocawork Backend with Gemini AI
Run this to start the Flask server
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def check_environment():
    """Check if required environment variables are set"""
    print("Checking environment variables...")
    
    gemini_key = os.environ.get('GEMINI_API_KEY')
    if gemini_key:
        print("✅ GEMINI_API_KEY found")
    else:
        print("⚠️  GEMINI_API_KEY not found - will use fallback responses")
    
    return True

def start_server():
    """Start the Flask server"""
    print("Starting Vocawork backend server with Gemini AI...")
    print("🚀 Server will be available at: http://localhost:5000")
    print("📱 Frontend should connect to: http://localhost:5000/api")
    print("🤖 Gemini AI integration: Speech-to-text and intent extraction")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Set environment variables
        os.environ['FLASK_DEBUG'] = 'True'
        os.environ['HOST'] = '0.0.0.0'
        os.environ['PORT'] = '5000'
        
        # Run the Flask app
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    print("🎯 Vocawork Backend Setup with Gemini AI")
    print("=" * 50)
    
    # Check environment
    if check_environment():
        # Install requirements
        if install_requirements():
            print("\n" + "=" * 50)
            start_server()
        else:
            print("❌ Setup failed. Please check the error messages above.")