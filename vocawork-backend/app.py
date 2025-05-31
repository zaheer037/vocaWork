from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import logging
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import tempfile
import google.generativeai as genai
import speech_recognition as sr
from pydub import AudioSegment
import io
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'static/audio'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a', 'webm'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Configure Gemini AI
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    logger.info("Gemini AI configured successfully")
else:
    logger.warning("GEMINI_API_KEY not found. Using mock responses.")
    model = None

# Sample job database
JOB_DATABASE = [
    {
        "id": "1",
        "title": "Software Developer",
        "company": "TechSolutions India",
        "location": "Bangalore",
        "salary": "₹50,000 - ₹80,000 per month",
        "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "contact": "+91 9876543210",
        "description": "We are looking for a skilled Software Developer to join our team. The ideal candidate should have experience with JavaScript, React, and Node.js.",
        "posted_date": "2024-01-15T10:30:00Z"
    },
    {
        "id": "2",
        "title": "Data Analyst",
        "company": "Analytics Hub",
        "location": "Delhi",
        "salary": "₹40,000 - ₹60,000 per month",
        "skills": ["SQL", "Excel", "Python", "Data Visualization"],
        "contact": "+91 9876543211",
        "description": "Looking for a Data Analyst to help interpret data and turn it into information which can offer ways to improve our business.",
        "posted_date": "2024-01-10T14:20:00Z"
    },
    {
        "id": "3",
        "title": "Customer Service Representative",
        "company": "Global Services Ltd",
        "location": "Mumbai",
        "salary": "₹25,000 - ₹35,000 per month",
        "skills": ["Communication", "Problem Solving", "Customer Support"],
        "contact": "+91 9876543212",
        "description": "We need a Customer Service Representative to join our team and provide excellent customer support.",
        "posted_date": "2024-01-08T09:15:00Z"
    },
    {
        "id": "4",
        "title": "Marketing Manager",
        "company": "Creative Agency",
        "location": "Pune",
        "salary": "₹60,000 - ₹90,000 per month",
        "skills": ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
        "contact": "+91 9876543213",
        "description": "Seeking an experienced Marketing Manager to lead our digital marketing initiatives and drive brand growth.",
        "posted_date": "2024-01-12T16:45:00Z"
    },
    {
        "id": "5",
        "title": "Graphic Designer",
        "company": "Design Studio",
        "location": "Chennai",
        "salary": "₹35,000 - ₹50,000 per month",
        "skills": ["Photoshop", "Illustrator", "UI/UX", "Branding"],
        "contact": "+91 9876543214",
        "description": "Creative Graphic Designer needed to create stunning visual designs for our clients across various industries.",
        "posted_date": "2024-01-05T11:30:00Z"
    },
    {
        "id": "6",
        "title": "Sales Executive",
        "company": "Business Solutions",
        "location": "Hyderabad",
        "salary": "₹30,000 - ₹45,000 per month",
        "skills": ["Sales", "Communication", "CRM", "Lead Generation"],
        "contact": "+91 9876543215",
        "description": "Dynamic Sales Executive required to drive sales growth and build strong client relationships.",
        "posted_date": "2024-01-18T13:20:00Z"
    },
    {
        "id": "7",
        "title": "Web Developer",
        "company": "Digital Innovations",
        "location": "Bangalore",
        "salary": "₹45,000 - ₹70,000 per month",
        "skills": ["HTML", "CSS", "JavaScript", "PHP", "WordPress"],
        "contact": "+91 9876543216",
        "description": "Looking for a Web Developer to create and maintain websites for our diverse client base.",
        "posted_date": "2024-01-20T12:00:00Z"
    },
    {
        "id": "8",
        "title": "Content Writer",
        "company": "Media House",
        "location": "Delhi",
        "salary": "₹30,000 - ₹50,000 per month",
        "skills": ["Writing", "SEO", "Content Strategy", "Research"],
        "contact": "+91 9876543217",
        "description": "Creative Content Writer needed to produce engaging content for various digital platforms.",
        "posted_date": "2024-01-22T15:30:00Z"
    }
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_audio_to_wav(input_path):
    """Convert audio file to WAV format for speech recognition"""
    try:
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Convert to WAV format
        output_path = input_path.rsplit('.', 1)[0] + '_converted.wav'
        audio.export(output_path, format="wav")
        
        return output_path
    except Exception as e:
        logger.error(f"Error converting audio: {str(e)}")
        return input_path

def speech_to_text_with_sr(audio_path, language):
    """Convert speech to text using SpeechRecognition library"""
    try:
        # Convert audio to WAV if needed
        wav_path = convert_audio_to_wav(audio_path)
        
        # Initialize recognizer
        r = sr.Recognizer()
        
        # Language mapping for Google Speech Recognition
        lang_map = {
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'en': 'en-IN'
        }
        
        google_lang = lang_map.get(language, 'en-IN')
        
        # Load audio file
        with sr.AudioFile(wav_path) as source:
            audio_data = r.record(source)
        
        # Recognize speech
        try:
            text = r.recognize_google(audio_data, language=google_lang)
            logger.info(f"Speech recognition successful: {text}")
            return text
        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return get_mock_transcript(language)
        except sr.RequestError as e:
            logger.error(f"Google Speech Recognition error: {e}")
            return get_mock_transcript(language)
            
    except Exception as e:
        logger.error(f"Error in speech recognition: {str(e)}")
        return get_mock_transcript(language)

def get_mock_transcript(language):
    """Get mock transcript for demonstration"""
    mock_responses = {
        'hi': "मुझे दिल्ली में डेटा एनालिस्ट की नौकरी चाहिए",
        'ta': "எனக்கு சென்னையில் சॉப्ट்வேர் டெवலப்பர் வேலை தேவை",
        'te': "నాకు హైదరాబాద్‌లో సాఫ్ట్‌వేర్ ఇంజనీర్ ఉద్యోగం కావాలి",
        'mr': "मला मुंबईत मार्केटिंग मॅनेजर पद हवे आहे",
        'en': "I need a software developer job in Bangalore"
    }
    return mock_responses.get(language, "I need a job")

def extract_intent_with_gemini(text, language):
    """Extract job search intent using Gemini AI"""
    if not model:
        return extract_intent_fallback(text, language)
    
    try:
        prompt = f"""
        Analyze this job search request and extract the key information:
        
        Text: "{text}"
        Language: {language}
        
        Please extract:
        1. Job role/title (if mentioned)
        2. Location (if mentioned)
        3. Any specific skills or requirements
        
        Return the response in this JSON format:
        {{
            "job_role": "extracted job role or empty string",
            "location": "extracted location or empty string",
            "skills": ["list of skills mentioned"],
            "original_text": "{text}"
        }}
        
        If the text is in a regional Indian language, translate the job role and location to English for matching purposes.
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON from response
        response_text = response.text.strip()
        
        # Extract JSON from response (handle cases where response has extra text)
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            intent = json.loads(json_str)
            logger.info(f"Gemini intent extraction successful: {intent}")
            return intent
        else:
            logger.warning("Could not parse JSON from Gemini response")
            return extract_intent_fallback(text, language)
            
    except Exception as e:
        logger.error(f"Error with Gemini intent extraction: {str(e)}")
        return extract_intent_fallback(text, language)

def extract_intent_fallback(text, language):
    """Fallback intent extraction using keyword matching"""
    text_lower = text.lower()
    
    # Job role keywords for different languages
    job_keywords = {
        'en': {
            'software developer': ['developer', 'programmer', 'software engineer'],
            'data analyst': ['data analyst', 'analyst'],
            'marketing manager': ['marketing', 'manager'],
            'graphic designer': ['designer', 'graphic'],
            'sales executive': ['sales', 'executive'],
            'customer service': ['customer service', 'support'],
            'web developer': ['web developer', 'web designer'],
            'content writer': ['content writer', 'writer']
        },
        'hi': {
            'software developer': ['डेवलपर', 'प्रोग्रामर', 'सॉफ्टवेयर इंजीनियर'],
            'data analyst': ['डेटा एनालिस्ट', 'एनालिस्ट'],
            'marketing manager': ['मार्केटिंग', 'मैनेजर'],
            'graphic designer': ['डिजाइनर', 'ग्राफिक'],
            'sales executive': ['सेल्स', 'बिक्री'],
            'customer service': ['ग्राहक सेवा', 'सपोर्ट']
        }
    }
    
    # Location keywords
    location_keywords = {
        'en': ['bangalore', 'delhi', 'mumbai', 'chennai', 'hyderabad', 'pune'],
        'hi': ['बैंगलोर', 'दिल्ली', 'मुंबई', 'चेन्नई', 'हैदराबाद', 'पुणे'],
        'ta': ['பெங்களூர்', 'டெல்லி', 'மும்பை', 'சென்னை', 'ஹைதராபாத்'],
        'te': ['బెంగళూరు', 'ఢిల్లీ', 'ముంబై', 'చెన్నై', 'హైదరాబాద్'],
        'mr': ['बेंगळुरू', 'दिल्ली', 'मुंबई', 'चेन्नई', 'हैदराबाद', 'पुणे']
    }
    
    # Extract job role
    job_role = ""
    lang_jobs = job_keywords.get(language, job_keywords['en'])
    for role, keywords in lang_jobs.items():
        if any(keyword.lower() in text_lower for keyword in keywords):
            job_role = role
            break
    
    # Extract location
    location = ""
    lang_locations = location_keywords.get(language, location_keywords['en'])
    for loc in lang_locations:
        if loc.lower() in text_lower:
            # Map to English location names
            location_map = {
                'बैंगलोर': 'bangalore', 'दिल्ली': 'delhi', 'मुंबई': 'mumbai',
                'चेन्नई': 'chennai', 'हैदराबाद': 'hyderabad', 'पुणे': 'pune',
                'பெங்களூர்': 'bangalore', 'டெல்லி': 'delhi', 'மும்பை': 'mumbai',
                'சென்னை': 'chennai', 'ஹைதராபாத்': 'hyderabad',
                'బెంగళూరు': 'bangalore', 'ఢిల్లీ': 'delhi', 'ముంబై': 'mumbai',
                'చెన్నై': 'chennai', 'హైదరాబాద్': 'hyderabad',
                'बेंगळुरू': 'bangalore', 'दिल्ली': 'delhi', 'मुंबई': 'mumbai',
                'चेन्नई': 'chennai', 'हैदराबाद': 'hyderabad', 'पुणे': 'pune'
            }
            location = location_map.get(loc.lower(), loc.lower())
            break
    
    return {
        "job_role": job_role,
        "location": location,
        "skills": [],
        "original_text": text
    }

def find_matching_jobs(intent):
    """Find jobs matching the extracted intent"""
    job_role = intent.get('job_role', '').lower()
    location = intent.get('location', '').lower()
    skills = intent.get('skills', [])
    
    matching_jobs = []
    
    for job in JOB_DATABASE:
        score = 0
        
        # Match job title
        if job_role:
            if job_role in job['title'].lower():
                score += 5
            elif any(word in job['title'].lower() for word in job_role.split()):
                score += 3
        
        # Match location
        if location:
            if location in job['location'].lower():
                score += 3
        
        # Match skills
        for skill in skills:
            if any(skill.lower() in job_skill.lower() for job_skill in job.get('skills', [])):
                score += 2
        
        # Match description keywords
        search_text = intent.get('original_text', '').lower()
        for word in search_text.split():
            if len(word) > 3 and word in job['description'].lower():
                score += 0.5
        
        if score > 0:
            matching_jobs.append((job, score))
    
    # Sort by score and return top matches
    matching_jobs.sort(key=lambda x: x[1], reverse=True)
    return [job for job, score in matching_jobs[:10]]

def generate_audio_response(text, language):
    """Generate audio response (mock implementation)"""
    try:
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(app.config['AUDIO_FOLDER'], filename)
        
        # Create a simple text file as mock audio (in production, use TTS)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Mock TTS Audio: {text} (Language: {language})")
        
        return f"/api/audio/{filename}"
    except Exception as e:
        logger.error(f"Error generating audio response: {str(e)}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": model is not None
    })

@app.route('/api/process-voice', methods=['POST'])
def process_voice():
    """Process voice input to search for jobs"""
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        # Get parameters
        language = request.form.get('language', 'en')
        
        # Save the file temporarily
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        logger.info(f"Processing audio file: {filename} in language: {language}")
        
        # 1. Convert speech to text
        transcript = speech_to_text_with_sr(filepath, language)
        logger.info(f"Transcript: {transcript}")
        
        # 2. Extract intent using Gemini AI
        intent = extract_intent_with_gemini(transcript, language)
        logger.info(f"Extracted intent: {intent}")
        
        # 3. Find matching jobs
        matching_jobs = find_matching_jobs(intent)
        logger.info(f"Found {len(matching_jobs)} matching jobs")
        
        # 4. Generate audio response
        if matching_jobs:
            response_text = f"Found {len(matching_jobs)} jobs for you"
            audio_url = generate_audio_response(response_text, language)
        else:
            response_text = "No matching jobs found"
            audio_url = generate_audio_response(response_text, language)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
            # Also remove converted WAV file if it exists
            wav_path = filepath.rsplit('.', 1)[0] + '_converted.wav'
            if os.path.exists(wav_path):
                os.remove(wav_path)
        except:
            pass
        
        return jsonify({
            "transcript": transcript,
            "intent": intent,
            "jobs": matching_jobs,
            "audio_url": audio_url
        })
        
    except Exception as e:
        logger.error(f"Error processing voice request: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs or filter by query parameters"""
    query = request.args.get('query', '').lower()
    location = request.args.get('location', '').lower()
    
    filtered_jobs = JOB_DATABASE.copy()
    
    if query:
        filtered_jobs = [job for job in filtered_jobs if 
                        query in job['title'].lower() or 
                        query in job['description'].lower() or
                        any(query in skill.lower() for skill in job['skills'])]
    
    if location:
        filtered_jobs = [job for job in filtered_jobs if location in job['location'].lower()]
    
    return jsonify(filtered_jobs)

@app.route('/api/jobs', methods=['POST'])
def add_job():
    """Add a new job to the database"""
    try:
        job_data = request.json
        
        # Validate required fields
        required_fields = ['title', 'company', 'location', 'salary', 'contact', 'description']
        for field in required_fields:
            if field not in job_data or not job_data[field]:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Add job ID and timestamp
        job_data['id'] = str(uuid.uuid4())
        job_data['posted_date'] = datetime.now().isoformat()
        
        # Ensure skills is a list
        if 'skills' not in job_data:
            job_data['skills'] = []
        elif isinstance(job_data['skills'], str):
            job_data['skills'] = [skill.strip() for skill in job_data['skills'].split(',') if skill.strip()]
        
        # Add to database
        JOB_DATABASE.append(job_data)
        
        logger.info(f"New job added: {job_data['title']} at {job_data['company']}")
        
        return jsonify({"message": "Job added successfully", "job": job_data})
    
    except Exception as e:
        logger.error(f"Error adding job: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/audio/<filename>')
def serve_audio(filename):
    """Serve audio files"""
    try:
        return send_from_directory(app.config['AUDIO_FOLDER'], filename)
    except Exception as e:
        logger.error(f"Error serving audio file {filename}: {str(e)}")
        return jsonify({"error": "Audio file not found"}), 404

@app.route('/api/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job by ID"""
    try:
        global JOB_DATABASE
        original_length = len(JOB_DATABASE)
        JOB_DATABASE = [job for job in JOB_DATABASE if job['id'] != job_id]
        
        if len(JOB_DATABASE) < original_length:
            return jsonify({"message": "Job deleted successfully"})
        else:
            return jsonify({"error": "Job not found"}), 404
    
    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum size is 16MB."}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting Vocawork backend on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Gemini AI: {'Configured' if model else 'Not configured (using fallback)'}")
    
    app.run(host=host, port=port, debug=debug)