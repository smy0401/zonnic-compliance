import os
import requests
import time


API_URL = "http://localhost:8000/api/evaluate"
TEST_FOLDER = "test_assets" 


EXPECTED_RESULTS = {
    "TROPICALBREEZENICOTINEPOUCH-VAPEBAZAAR.webp": "FAIL",  
    "images (1).jpg": "Pass",                                
    "Screenshot 2026-03-26 133803.png": "PASS",             
    "Screenshot 2026-03-26 132724.png": "PASS"              
}

def run_evaluation_suite():
    print("\n" + "="*50)
    print(" INITIATING ZONNIC EVALUATION HARNESS v1.0")
    print("="*50 + "\n")
    
    if not os.path.exists(TEST_FOLDER):
        print(f" Error: Folder '{TEST_FOLDER}' not found.")
        print("Please create it and add your test images.")
        return

    passed_tests = 0
    total_tests = 0
    start_time = time.time()

    for filename in os.listdir(TEST_FOLDER):
        if filename not in EXPECTED_RESULTS:
            continue 
            
        total_tests += 1
        filepath = os.path.join(TEST_FOLDER, filename)
        expected = EXPECTED_RESULTS[filename]
        
        print(f"Testing: {filename} ... ", end="", flush=True)
        
        try:
            with open(filepath, "rb") as img_file:
                files = {"file": (filename, img_file, "image/jpeg")}
                response = requests.post(API_URL, files=files)
                
            if response.status_code == 200:
                actual = response.json().get("status")
                
                if actual == expected:
                    print(f"✅ PASS (Expected: {expected}, Got: {actual})")
                    passed_tests += 1
                else:
                    print(f"❌ FAIL (Expected: {expected}, Got: {actual})")
                    print(f"   ↳ Issues Identified: {response.json().get('issues')}")
            else:
                print(f"⚠️ API ERROR {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ CONNECTION ERROR: Is main.py running?")
            break

        time.sleep(3)

    # Final Report
    duration = round(time.time() - start_time, 2)
    accuracy = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print("\n" + "="*50)
    print(" EVALUATION HARNESS REPORT")
    print("="*50)
    print(f"Total Tests Run: {total_tests}")
    print(f"Successful Tests: {passed_tests}")
    print(f"System Accuracy:  {accuracy:.1f}%")
    print(f"Execution Time:   {duration} seconds")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_evaluation_suite()