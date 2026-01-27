
def check_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char == '{':
                stack.append(('{', i + 1, j + 1))
            elif char == '}':
                if not stack:
                    print(f"Extra closing brace at line {i+1}, col {j+1}")
                else:
                    stack.pop()
            elif char == '(':
                stack.append(('(', i + 1, j + 1))
            elif char == ')':
                if not stack:
                    print(f"Extra closing parenthesis at line {i+1}, col {j+1}")
                elif stack[-1][0] == '(':
                    stack.pop()
                else:
                    print(f"Mismatch: found ) but expected closing for {stack[-1][0]} from line {stack[-1][1]}")
    
    for item in stack:
        print(f"Unclosed {item[0]} from line {item[1]}, col {item[2]}")

if __name__ == "__main__":
    check_braces("/Users/barathraj/Desktop/HACKATHON/frontend/src/app/admin/dashboard/page.js")
