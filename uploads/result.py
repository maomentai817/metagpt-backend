from pathlib import Path
import re
# from metagpt.const import METAGPT_ROOT
import os

# 获取当前脚本的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
log_file_dir = Path(current_dir).parent / "logs" / "new"
output_file_dir = Path(current_dir).parent / "logs" / "result"

# log_file_dir = METAGPT_ROOT / "logs" / "new"
# output_file_dir = METAGPT_ROOT / "logs" / "result"

# 检查并创建输入目录
log_file_dir.mkdir(parents=True, exist_ok=True)

# 检查并创建输出目录
output_file_dir.mkdir(parents=True, exist_ok=True)

# 正则表达式模式
role_action_pattern = re.compile(r"^.* do (.+?)(?:\(.+?\))?$")
file_save_pattern = re.compile(r"^.* - save to: (.+)$")
role_pattern = re.compile(r".*\|.*\|.*metagpt\.roles\.role:.*\s-\s(.*?\(.*?\))")

def process_logs():
    file_cache = {}  # 缓存文件内容
    for log_file_path in log_file_dir.glob("*.log"):
        current_role = None
        action = None
        results = {}  # 用字典存储每个项目名称的结果列表

        # 逐行处理日志文件
        with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as log_file:
            for line in log_file:
                line = line.strip()
                role_action_match = role_action_pattern.match(line)
                file_save_match = file_save_pattern.search(line)
                role_match = role_pattern.search(line)

                if role_match:
                    current_role = role_match.group(1)
                    if role_action_match:
                        action = role_action_match.group(1)
                elif file_save_match and current_role and action:
                    file_path = file_save_match.group(1)

                    # 尝试读取文件内容作为上下文
                    if file_path not in file_cache:
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                                file_cache[file_path] = file.read()
                        except Exception as e:
                            print(f"读取文件 {file_path} 失败：{str(e)}")
                            continue
                    
                    context = file_cache.get(file_path, "")

                    # 提取文件名和项目名称
                    file_name = Path(file_path).name
                    workspace_path = Path(file_path)
                    project_name = workspace_path.parts[workspace_path.parts.index("workspace") + 1] if "workspace" in workspace_path.parts else "unknown_project"

                    # 将结果添加到项目名称对应的列表中
                    if project_name not in results:
                        results[project_name] = []
                    results[project_name].append({
                        "role": current_role,
                        "action": action,
                        "file_path": file_path,
                        "file_name": file_name,
                        "context": context
                    })

        # 为每个项目名称生成一个输出文件
        for project_name, project_results in results.items():
            if project_results:
                output_file_path = output_file_dir / f"{project_name}_{log_file_path.stem}.log"
                with open(output_file_path, 'w', encoding='utf-8', errors='ignore') as output_file:
                    for result in project_results:
                        output_file.write(f"Project Name: {project_name},\n"
                                          f"Role: {result['role']},\n"
                                          f"Action: {result['action']},\n"
                                          f"File Path: {result['file_path']},\n"
                                          f"File Name: {result['file_name']},\n"
                                          f"Context:\n{result['context']}\n\n")

                print(f"处理完成: {log_file_path} -> {output_file_path}")
            else:
                print(f"日志文件 {log_file_path} 没有符合条件的条目。")

if __name__ == "__main__":
    process_logs()
