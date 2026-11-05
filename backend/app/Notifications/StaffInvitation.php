<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StaffInvitation extends Notification
{
    public function __construct(public string $organizationName, public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Join '.$this->organizationName.' on SAYNTRA')->line('You have been invited to a SAYNTRA repair workspace.')->action('Review invitation', config('sayntra.frontend_url').'/invite/'.$this->token)->line('This invitation expires in 72 hours. Ignore it if you do not recognize the business.');
    }
}
