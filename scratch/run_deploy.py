import sys
import paramiko

# Force stdout to output UTF-8 safely
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_remote_deploy():
    host = "72.62.27.196"
    username = "root"
    password = "e#LWhcSAa6B&R8s"
    command = "cd /var/www/zag-offers && git checkout -- deploy.sh && git pull origin main && bash deploy.sh"
    
    print("Connecting to the VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=username, password=password, timeout=10)
        print("Connected! Executing deployment script...")
        stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
        
        # Stream the output in real time
        while True:
            line = stdout.readline()
            if not line:
                break
            sys.stdout.write(line)
            sys.stdout.flush()
            
        exit_status = stdout.channel.recv_exit_status()
        print(f"\nCommand finished with exit status: {exit_status}")
    except Exception as e:
        print(f"Error during SSH deployment: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    run_remote_deploy()
