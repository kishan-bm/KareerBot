# check_models.py

import os
from google import genai

# !!! IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Gemini API key !!!
# This is a temporary measure for this diagnostic script.
API_KEY = "AIzaSyDz5nCBHMXnblvjprDWEI9YY8vJSmLlu_A" 

try:
    # Initialize the client by passing the API key directly
    client = genai.Client(api_key=API_KEY)
    
    print("--- Available Gemini Models ---")
    
    # List models using the client
    for model in client.models.list():
        # Check if the model name starts with 'gemini'
        if model.name.startswith('models/gemini'):
            
            # This is the property that replaced supported_generation_methods
            is_supported = any(m == 'generateContent' for m in model.methods) 

            if is_supported:
                 print(f"- {model.name}")
            else:
                 # Print models that are gemini but may not support chat/generateContent (e.g., embeddings)
                 print(f"- {model.name} (Does not support generateContent)")
            
except Exception as e:
    # If the above fails, let's try a simpler approach (Model only has name)
    print(f"\nCould not check model capabilities due to: {e}. Attempting simple list...")
    
    try:
        client = genai.Client(api_key=API_KEY)
        for model in client.models.list():
            if model.name.startswith('models/gemini'):
                print(f"- {model.name} (Check if this is the correct name for app.py)")
    except Exception as e_simple:
        print(f"\nSimple list failed. Please check your API key and google-genai package.")
        print(f"Error: {e_simple}")