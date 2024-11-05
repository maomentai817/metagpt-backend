from pathlib import Path
import json
import chardet
# from metagpt.const import METAGPT_ROOT
import os

def detect_encoding(file_path):
    with open(file_path, 'rb') as f:
        raw_data = f.read(10000)  # 读取文件的一部分进行编码检测
        result = chardet.detect(raw_data)
        return result['encoding']

def filter_log_lines(input_dir, output_dir, search_strings=None, exclude_strings=None):
    if search_strings is None:
        search_strings = ['metagpt.utils.file_repository:save', 'metagpt.roles.role:_act', 
                          'metagpt.roles.role:_react', 'metagpt.utils.git_repository:archive']
    
    if exclude_strings is None:
        exclude_strings = ['metagpt.roles.role:run:']
        
    try:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        for log_file in Path(input_dir).glob("*.log"):
            output_file_path = Path(output_dir) / f"new_{log_file.name}"
            file_encoding = detect_encoding(log_file)

            with log_file.open('r', encoding=file_encoding, errors='ignore') as log_file, output_file_path.open('w', encoding='utf-8') as output_file:
                for line in log_file:
                    if process_log_line(line, search_strings, exclude_strings, output_file, log_file.name):
                        continue

        print(f"Filtered lines have been written to the corresponding new log files in {output_dir}. {input_dir}")
    except FileNotFoundError:
        print(f"Error: The directory {input_dir} was not found.")
    except IOError as e:
        print(f"Error: An error occurred while reading or writing the files. {e}")

def process_log_line(line, search_strings, exclude_strings, output_file, filename):
    try:
        json_obj = json.loads(line)
        text = json_obj.get('text', '')

        if any(search_string in text for search_string in search_strings) and not any(exclude_string in text for exclude_string in exclude_strings):
            output_file.write(text + '\n')
            return True
    except json.JSONDecodeError:
        print(f"Skipping invalid JSON line in {filename}: {line.strip()}")
    return False

# log_file_dir = METAGPT_ROOT / "logs"
# output_file_dir = METAGPT_ROOT / "logs" / "new"

current_dir = os.path.dirname(os.path.abspath(__file__))
log_file_dir = Path(current_dir).parent / "logs"
output_file_dir = Path(current_dir).parent / "logs" / "new"

filter_log_lines(log_file_dir, output_file_dir)
