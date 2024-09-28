import os
import re
import glob
import time
from colorama import Fore, Style
from tabulate import tabulate

RPC = None
prev_bandwidth_data = []
prev_earnings_data = []
prev_workloads_data = []
prev_wallet_data = []
directory_path = r'C:\ProgramData\Salad\logs' #Directory of the logs folder change this if you want to do testing in a seperate folder

def find_latest_log_file(directory):
    log_files = glob.glob(os.path.join(directory, 'log-*.txt')) # Get a list of all files starting with 'log-' and ending with '.txt'
    latest_log_file = max(log_files, key=os.path.getmtime) # Sort the files by modification time and get the latest one
    return latest_log_file

def find_latest_and_oldest_bandwidth_log(directory):
    bandwidth_folders = glob.glob(os.path.join(directory, 'Bandwidth*')) # Get a list of all folders starting with 'Bandwidth'
    latest_bandwidth_folder = max(bandwidth_folders, key=os.path.getmtime, default=None) # Sorts the folders by modification time and get the latest one
    
    if latest_bandwidth_folder:
        bandwidth_log_files = glob.glob(os.path.join(latest_bandwidth_folder, 'bandwidth*')) # Get a list of all files ending with '.txt' within the latest bandwidth folder
        latest_bandwidth_log_file = max(bandwidth_log_files, key=os.path.getmtime, default=None) # Sort the files by modification time and get the latest one
        oldest_bandwidth_log_file = min(bandwidth_log_files, key=os.path.getmtime, default=None) # Sort the files by modification time and get the oldest one
        return latest_bandwidth_log_file, oldest_bandwidth_log_file

def extract_info_from_log_file(log_file_path):
    predicted_earnings_matches = []
    workload_manager_matches = []
    wallet_matches = []

    with open(log_file_path, 'r') as file:
        for line in reversed(list(file)):
            predicted_earnings_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?Predicted Earnings Report: (.+)', line)
            if predicted_earnings_match:
                predicted_earnings_matches.append(predicted_earnings_match.groups())

            workload_manager_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?WorkloadManager: Added.*?Name = (.*?), Image = (.*?)(?:,|\})', line, re.DOTALL)
            if workload_manager_match:
                workload_manager_matches.append(workload_manager_match.groups())

            wallet_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?Wallet: Current\(([\d.]+)\), Predicted\(([-\d.]+)\)', line)
            if wallet_match:
                wallet_matches.append(wallet_match.groups())

    return predicted_earnings_matches, workload_manager_matches, wallet_matches

def extract_info_from_bandwidth_log(bandwidth_log):
    bandwidth_log_data = []

    with open(bandwidth_log, 'r') as file:
        for line in reversed(list(file)):
            bandwidth_log_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?"BidirThroughput":(-?\d+).*?"ErrorRate":(-?\d+)', line)
            if bandwidth_log_match:
                bandwidth_log_data.append(bandwidth_log_match.groups())

    return bandwidth_log_data

def extract_gateway_from_oldest_bandwidth_log(directory_path):
    _, oldest_bandwidth_log = find_latest_and_oldest_bandwidth_log(directory_path)
    gateway = None
    with open(oldest_bandwidth_log, 'r') as file:
        for line in file:
            gateway_match = re.search(r'-server_host_port (.*?):443', line)
            if gateway_match:
                gateway = gateway_match.group(1)
                break  # stop processing lines once gateway is found
    return gateway

while True:
    # Find the latest log file and extract information
    latest_log_file_path = find_latest_log_file(directory_path)
    result = find_latest_and_oldest_bandwidth_log(directory_path)

    latest_bandwidth_log, oldest_bandwidth_log = result if result is not None else (None, None)

    # Extract information from the latest log files
    bandwidth_data = extract_info_from_bandwidth_log(latest_bandwidth_log) if latest_bandwidth_log is not None else None
    earnings_data, workloads_data, wallet_data = extract_info_from_log_file(latest_log_file_path)
        
    # Extract gateway from the oldest bandwidth log
    gateway = extract_gateway_from_oldest_bandwidth_log(directory_path) if oldest_bandwidth_log is not None else None

    os.system('cls')

    # Bandwidth Data Display
    if bandwidth_data is None:
        print(Fore.RED + "\nSGS Bandwidth Usage/Errors (No Data Found):" + Style.RESET_ALL)
    elif bandwidth_data != prev_bandwidth_data:
        print(Fore.GREEN + "\nSGS Bandwidth Usage/Errors (Updated Data):" + Style.RESET_ALL)
        prev_bandwidth_data = bandwidth_data
    else:
        print(Fore.RED + "\nSGS Bandwidth Usage/Errors (Old Data, Not Updated):" + Style.RESET_ALL)
    table = [[f'{i+1}', timestamp, f'{int(BidirThroughput) / 250000:.2f} Mbps', ErrorRate] 
             for i, (timestamp, BidirThroughput, ErrorRate) in enumerate(prev_bandwidth_data[:5])]
    print(tabulate(table, headers=['No.', 'Timestamp', 'BidirThroughput', 'ErrorRate']))
    
    # Workloads Data Display
    if workloads_data != prev_workloads_data:
        print(Fore.YELLOW + '\nWorkloads Information (Updated Data):' + Style.RESET_ALL)
        prev_workloads_data = workloads_data
    else:
        print(Fore.RED + "\nWorkloads Information (Old Data, Not Updated):" + Style.RESET_ALL)

    table = [[f'{i+1}', timestamp, workload_info_1, gateway if 'bandwidth' in workload_info_1.lower() else workload_info_2] 
             for i, (timestamp, workload_info_1, workload_info_2) in enumerate(prev_workloads_data[:5])]
    print(tabulate(table, headers=['No.', 'Timestamp', 'Workload ID', 'Workload Image']))

    #Earnings Data Display
    if earnings_data != prev_earnings_data:
        print(Fore.BLUE + '\nContainer Earnings Report (Updated Data):' + Style.RESET_ALL)
        prev_earnings_data = earnings_data
    else:
        print(Fore.RED + "\nContainer Earnings Report (Old Data, Not Updated):" + Style.RESET_ALL)
    table = [[f'{i+1}', timestamp, predicted_earnings_report] 
             for i, (timestamp, predicted_earnings_report) in enumerate(prev_earnings_data[:5])]
    print(tabulate(table, headers=['No.', 'Timestamp', 'Predicted Earnings']))

    # Wallet Data Display
    if wallet_data != prev_wallet_data:
        print(Fore.MAGENTA + '\nWallet Information (Updated Data):' + Style.RESET_ALL)
        prev_wallet_data = wallet_data
    else:
        print(Fore.RED + "\nWallet Information (Old Data, Not Updated):" + Style.RESET_ALL)
    table = [[f'{i+1}', timestamp, current_balance, predicted_balance] 
             for i, (timestamp, current_balance, predicted_balance) in enumerate(prev_wallet_data[:5])]
    print(tabulate(table, headers=['No.', 'Timestamp', 'Current Balance', 'Predicted Balance']))

    # Update console title with latest predicted earnings and balance
    if earnings_data and wallet_data:
        latest_earnings = earnings_data[0][1]
        latest_balance = wallet_data[0][1]
        os.system(f'title Predicted Earnings: {latest_earnings} - Current Balance: {latest_balance}')


    time.sleep(15)